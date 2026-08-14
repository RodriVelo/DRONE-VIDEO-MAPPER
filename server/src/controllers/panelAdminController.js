import { getStatsModel , getUsersModel , eliminarUsuarioModel} from "../models/panelAdminModels.js";

export const getStats = async (req, res) => {
  try {
    const stats = await getStatsModel();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error en getStats",
    });
  }
};

export const getUsers = async (req, res) => {

  try {
    const response = await getUsersModel();

    res.json({
      success: true,
      users: response,
    });

  } catch (error) {
    console.error("Error getting user:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const eliminarUsuario = async (req,res)=>{
  const id_user = req.params.id
  try {
    await eliminarUsuarioModel(id_user);
    res.json({
      success:true,
      message:"Usuario eliminado"
    })
  } catch (error) {
    res.status(500).json({
      success:false,
      message:"Error al elminar el usuario"
    })
    
  }
}

