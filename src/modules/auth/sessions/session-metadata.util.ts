export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';

export interface RequestMetadata {
    ipAddress: string | null;
    userAgent: string | null;
}

export interface DeviceMetadata {
    deviceName: string | null;
    deviceType: DeviceType;
}

export function detectDeviceMetadata(userAgent: string | null): DeviceMetadata {
    if (!userAgent) {
        return {
            deviceName: null,
            deviceType: 'UNKNOWN',
        };
    }

    const agent = userAgent.toLowerCase();

    let deviceType: DeviceType = 'DESKTOP';

    if (/ipad|tablet|kindle|silk/.test(agent)) {
        deviceType = 'TABLET';
    } else if (/iphone|ipod|android.*mobile|mobile/.test(agent)) {
        deviceType = 'MOBILE';
    } else if (!/windows|macintosh|mac os|linux/.test(agent)) {
        deviceType = 'UNKNOWN';
    }

    let deviceName: string;

    if (/iphone/.test(agent)) {
        deviceName = 'iPhone';
    } else if (/ipad/.test(agent)) {
        deviceName = 'iPad';
    } else if (/android/.test(agent)) {
        deviceName = 'Android device';
    } else if (/windows/.test(agent)) {
        deviceName = 'Windows device';
    } else if (/macintosh|mac os/.test(agent)) {
        deviceName = 'Mac';
    } else if (/linux/.test(agent)) {
        deviceName = 'Linux device';
    } else {
        deviceName = 'Unknown device';
    }

    return { deviceName, deviceType };
}
