import mongoose from "mongoose";

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected");
    } catch (error) {
        console.error("Connection error:", error);
    }
};

export default connectToDB;
