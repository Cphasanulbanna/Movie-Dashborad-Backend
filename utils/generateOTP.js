const generateOtp = () => {
    let otp = "";
    for (let i = 0; i < 4; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

module.exports = { generateOtp };
