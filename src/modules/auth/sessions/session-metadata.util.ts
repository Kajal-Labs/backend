export type DeviceType = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';

export interface RequestMetadata {
    ipAddress: string | null;
    userAgent: string | null;
}

export interface DeviceMetadata {
    deviceName: string | null;
    deviceType: DeviceType;
}

// Order matters: iPhone/iPad/Android UAs also contain "mac os" / "linux".
const DEVICE_NAMES: ReadonlyArray<readonly [RegExp, string]> = [
    [/iphone/, 'iPhone'],
    [/ipad/, 'iPad'],
    [/android/, 'Android device'],
    [/windows/, 'Windows device'],
    [/macintosh|mac os/, 'Mac'],
    [/linux/, 'Linux device'],
];

export function detectDeviceMetadata(userAgent: string | null): DeviceMetadata {
    if (!userAgent) {
        return { deviceName: null, deviceType: 'UNKNOWN' };
    }

    const agent = userAgent.toLowerCase();

    return {
        deviceName: DEVICE_NAMES.find(([pattern]) => pattern.test(agent))?.[1] ?? 'Unknown device',
        deviceType: detectDeviceType(agent),
    };
}

function detectDeviceType(agent: string): DeviceType {
    // Android phones include "mobile" in the UA; Android tablets do not.
    if (/ipad|tablet|kindle|silk/.test(agent) || (/android/.test(agent) && !/mobile/.test(agent))) {
        return 'TABLET';
    }

    if (/iphone|ipod|mobile/.test(agent)) {
        return 'MOBILE';
    }

    return 'DESKTOP';
}
