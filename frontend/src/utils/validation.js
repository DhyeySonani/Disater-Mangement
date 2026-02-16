export const isValidIndianMobile = (phone) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
};
