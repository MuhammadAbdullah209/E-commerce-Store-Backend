export const OTP_gen = () => {
    return Math.floor(100000 + Math.random() * 90000000).toString()
}