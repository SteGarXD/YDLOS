class ConstContainer:
    """
    Base class for all const containers.
    """


class DatasetConstraints(ConstContainer):
    """
    Various dataset limits (raised for open-source / on-prem to avoid artificial caps).
    """

    # TODO: Figure out the best place to put this stuff
    FIELD_COUNT_LIMIT_SOFT = 10_000
    FIELD_COUNT_LIMIT_HARD = 10_500

    FIELD_UI_SETTINGS_MAX_SIZE = 256 * 1024
    OVERALL_UI_SETTINGS_MAX_SIZE = 16 * 1024 * 1024


class DataAPILimits(ConstContainer):
    """
    Data limits (raised for open-source / on-prem to avoid artificial caps).
    """

    DEFAULT_SUBQUERY_LIMIT = 10_000_000
    DEFAULT_SOURCE_DB_LIMIT = 10_000_000
    PREVIEW_ROW_LIMIT = 100_000

    # endpoint-specific
    PREVIEW_API_DEFAULT_ROW_COUNT_HARD_LIMIT = 10_000_000
    DATA_API_DEFAULT_ROW_COUNT_HARD_LIMIT = 10_000_000
    PIVOT_API_DEFAULT_ROW_COUNT_HARD_LIMIT = 10_000_000
