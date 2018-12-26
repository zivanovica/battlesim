class MathEx {
    /**
     *
     * Generates random value in range between provided "min" and "max"
     *
     * @param {{min: number}, {max: number}}
     * @returns {number}
     */
    static random({min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER} = {}) {
        return min + (Math.random() * (max - min));
    }

    /**
     * Calculate geometric average of provided array
     *
     * @param {Array} values
     * @returns {number}
     */
    static average(values) {
        if (false === values instanceof Array) {
            return 0;
        }

        return Math.pow(values.reduce((total, current) => ((total || 1) * current)), 1.0 / values.length);
    }
}

module.exports = {MathEx};