import mongoose from "mongoose";


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Db Connection Stable!");
    } catch (error) {
        console.log("DB Connection Error:", error.message);
        process.exit(1); 
    }
};

export default connectDB;