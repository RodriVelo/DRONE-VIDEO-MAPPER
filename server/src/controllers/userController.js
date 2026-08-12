import { getUserModel , updateUserModel} from "../models/userModels.js";

export const getUser = async (req, res) => {


  try {
    const response = await getUserModel(req.user.id);

    res.json({
      success: true,
      user: response,
    });

  } catch (error) {
    console.error("Error getting user:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await updateUserModel(userId, req.body);

    const updatedUser = await getUserModel(userId);

    res.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

