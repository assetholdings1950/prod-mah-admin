export const getInitials = (fullName: string | undefined | null): string => {
    if (!fullName?.trim()) return "";

    return fullName
        .trim()
        .split(/\s+/) // split by one or more spaces
        .map((word) => word[0].toUpperCase())
        .join("");
};