
export const removeSpaces = (str) => {
    if (!str) return '';
    return String(str).replace(/\s+/g, ''); 
}

export const normalizeIdentifier = (str) => {
    if (!str) return '';
    return String(str).replace(/[\s\/\-_]+/g, '').toUpperCase();
}