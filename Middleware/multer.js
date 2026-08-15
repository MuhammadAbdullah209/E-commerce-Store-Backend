import multer from "multer"
const storage = multer.memoryStorage()

export const singleStorage = multer({ storage }).single("image")
export const multiStorage = multer({ storage }).array("images", 5)