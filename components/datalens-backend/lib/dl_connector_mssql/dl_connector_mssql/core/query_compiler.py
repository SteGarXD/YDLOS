# YDL OS: wrap GROUP BY and ORDER BY in CAST(... AS NVARCHAR(4000)) so text/ntext columns
# can be used in GROUP BY/ORDER BY (SQL Server error "cannot be compared or sorted" otherwise).

from __future__ import annotations

from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.mssql import NVARCHAR
from sqlalchemy.sql.expression import nullsfirst, nullslast

from dl_constants.enums import OrderDirection
from dl_core.connectors.base.query_compiler import QueryCompiler
from dl_core.query.bi_query import BIQuery
from dl_core.query.expression import ExpressionCtx, OrderByExpressionCtx


if TYPE_CHECKING:
    from sqlalchemy.sql.elements import ClauseElement


def _cast_for_mssql(expr: ClauseElement) -> ClauseElement:
    """Wrap expression in CAST(... AS NVARCHAR(4000)) so text/ntext columns can be used in GROUP BY/ORDER BY."""
    return sa.cast(expr, NVARCHAR(4000))


class MSSQLQueryCompiler(QueryCompiler):
    def should_order_by_alias(self, expr_ctx: ExpressionCtx, bi_query: BIQuery) -> bool:
        if bi_query.limit is not None and bi_query.offset is not None:
            return False
        return super().should_order_by_alias(expr_ctx=expr_ctx, bi_query=bi_query)

    def make_select_expression(self, expr_ctx: ExpressionCtx, bi_query: BIQuery) -> ClauseElement:
        base = super().make_select_expression(expr_ctx=expr_ctx, bi_query=bi_query)
        # For dimensions (in group_by), SELECT must match GROUP BY so use same CAST
        if any(g.alias == expr_ctx.alias for g in bi_query.group_by_expressions):
            raw_group_expr = QueryCompiler.make_group_by_expression(
                self, expr_ctx=expr_ctx, bi_query=bi_query
            )
            return _cast_for_mssql(raw_group_expr).label(expr_ctx.alias)  # type: ignore[attr-defined]
        return base

    def make_group_by_expression(self, expr_ctx: ExpressionCtx, bi_query: BIQuery) -> ClauseElement:
        base = super().make_group_by_expression(expr_ctx=expr_ctx, bi_query=bi_query)
        return _cast_for_mssql(base)

    def make_order_by_expression(
        self, order_by_ctx: OrderByExpressionCtx, bi_query: BIQuery
    ) -> ClauseElement:
        # When ordering by alias (res_0, res_1...), do NOT cast — aliases refer to SELECT output
        # which is already CAST in our make_select_expression. Casting the alias breaks MSSQL (invalid column name).
        # Only cast when using raw expression (not alias).
        if self.should_order_by_alias(expr_ctx=order_by_ctx, bi_query=bi_query):
            expr = self.aliased_column(order_by_ctx)
        else:
            expr = _cast_for_mssql(order_by_ctx.expression)
        dir_wrapper = {OrderDirection.asc: sa.asc, OrderDirection.desc: sa.desc}[order_by_ctx.direction]
        expr = dir_wrapper(expr)
        if self.force_nulls_lower_than_values:
            nulls_wrapper = {
                OrderDirection.asc: nullsfirst,
                OrderDirection.desc: nullslast,
            }[order_by_ctx.direction]
            expr = nulls_wrapper(expr)
        return expr
