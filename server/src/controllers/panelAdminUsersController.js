import { cambiarEstadoUsuarioModel, editarPerfilUsuarioModel} from "../models/panelAdminUsersModel.js";

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