class Formatters {
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    static isImageUrl(avatar) {
        return avatar.includes('.') || avatar.includes('http');
    }
}