import { cambiarEstadoUsuarioModel, editarPerfilUsuarioModel,  getStatsModel , getUsersModel , eliminarUsuarioModel} from "../models/panelAdminUsersModel.js";

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


export const cambiarEstadoUsuario = async (req, res) => {
  console.log("llega pa")
  const nuevoEstado = req.body.estado;
  const id_user = req.params.id;

  try {
    await cambiarEstadoUsuarioModel(id_user, nuevoEstado);
    res.json({
      success: true,
      message: "Nuevo estado usuario",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado usuario",
    });
  }
};

export const editarPerfilUsuario = async (req,res) =>{
  const nuevoPerfil= req.body
  const id_user= req.params.id
  try {
    await editarPerfilUsuarioModel(id_user,nuevoPerfil);
    res.json({
      success:true,
      message: "Perfil actualizado"
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message: "Error al editar el perfil"
    })
  }
}

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

