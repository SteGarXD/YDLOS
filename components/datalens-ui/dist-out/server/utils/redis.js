"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = void 0;
const getRedisDsnConfig = (params = {}) => {
    const envName = params.envName || 'REDIS_DSN_LIST';
    const redisDsnList = process.env[envName];
    if (!(redisDsnList === null || redisDsnList === void 0 ? void 0 : redisDsnList.startsWith('redis://'))) {
        return {
            name: params.name || '',
            sentinels: params.sentinels || [],
        };
    }
    const dsnListString = redisDsnList.slice('redis://'.length);
    const [namePasswordString, redisSentinelsString] = dsnListString.split('@');
    const [name, password] = namePasswordString.split(':');
    const redisSentinels = redisSentinelsString
        .trim()
        .split(',')
        .map((hostPort) => {
        const [host, port] = hostPort.split(':');
        return { host: host.trim(), port: port ? parseInt(port, 10) : 26379 };
    });
    return {
        sentinels: redisSentinels,
        name,
        password,
    };
};
const getRedisConfig = (params = {}) => {
    const dsnConfig = getRedisDsnConfig(params);
    return {
        sentinels: dsnConfig.sentinels,
        name: dsnConfig.name,
        family: 6,
        password: dsnConfig.password,
        role: 'master',
    };
};
exports.getRedisConfig = getRedisConfig;
