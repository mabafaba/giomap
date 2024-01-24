function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function must(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}