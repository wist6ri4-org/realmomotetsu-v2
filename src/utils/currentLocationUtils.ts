export class CurrentLocationUtils {
    /**
     * 現在の位置情報を取得する
     * @returns {Promise<{ latitude: number; longitude: number, accuracy: number }>} 現在の位置情報
     */
    static async getCurrentLocation(): Promise<{
        latitude: number;
        longitude: number;
        accuracy: number;
    }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }
}
