
export const removeSpaces = (str) => {
    if (!str) return '';
    return String(str).replace(/\s+/g, ''); 
};

export const normalizeIdentifier = (str) => {
    if (!str) return '';
    return String(str).replace(/[\s\/\-_]+/g, '').toUpperCase();
};

/**
 * Format a roll number into canonical GBU format:
 * - Strips slashes, hyphens, underscores, and spaces
 * - Converts all letters to UPPERCASE
 * - Pads 1 or 2 digit serial numbers at the end to 3 digits (e.g., 265UCS77 -> 265UCS077)
 * - Examples:
 *   '225/ucc/001' -> '225UCC001'
 *   '235ucs002'   -> '235UCS002'
 *   '123ucd001'   -> '123UCD001'
 *   '13ucd001'    -> '13UCD001'
 *   '265ucs77'    -> '265UCS077'
 *   'r-225/ucf/059' -> 'R225UCF059'
 */
export const formatCanonicalRollNo = (str) => {
    if (!str) return '';
    let normalized = normalizeIdentifier(str);

    // If it matches pattern like PREFIX + 1 or 2 digits at the end (e.g. 265UCS77 -> 265UCS077)
    // Match non-digit characters followed by 1 or 2 digits at the very end
    const match = normalized.match(/^(.*?[A-Z]+)(\d{1,2})$/);
    if (match) {
        const prefix = match[1];
        const serial = match[2].padStart(3, '0');
        return `${prefix}${serial}`;
    }

    return normalized;
};

/**
 * Check if an identifier is a standard numeric enrollment number (8-12 digits)
 */
export const isNumericEnrollment = (str) => {
    if (!str) return false;
    const clean = String(str).replace(/[\s\/\-_]+/g, '');
    return /^\d{8,12}$/.test(clean);
};

/**
 * Check if an identifier is a standard alphanumeric roll number (contains dept code letters)
 */
export const isAlphanumericRollNo = (str) => {
    if (!str) return false;
    const clean = String(str).replace(/[\s\/\-_]+/g, '');
    return /[A-Za-z]/.test(clean);
};

/**
 * Detects if rollNo and enrollmentNo were swapped (e.g., numeric enrollment in rollNo and alphanumeric code in enrollmentNo)
 * Returns normalized and correctly placed values.
 */
export const detectAndCorrectSwappedIdentifiers = (rollNo, enrollmentNo) => {
    let r = rollNo ? String(rollNo).trim() : '';
    let e = enrollmentNo ? String(enrollmentNo).trim() : '';
    let wasSwapped = false;

    // Check if rollNo is purely numeric (8-12 digits) AND enrollmentNo has letters (like '255ics001')
    if (isNumericEnrollment(r) && isAlphanumericRollNo(e)) {
        const temp = r;
        r = e;
        e = temp;
        wasSwapped = true;
    }

    return {
        rollNo: r ? formatCanonicalRollNo(r) : null,
        enrollmentNo: e ? normalizeIdentifier(e) : null,
        wasSwapped
    };
};

/**
 * Cleanly format a full name into Title Case (e.g., "AKSHITA GOYAL" -> "Akshita Goyal")
 */
export const toTitleCase = (str) => {
    if (!str) return '';
    return String(str)
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};