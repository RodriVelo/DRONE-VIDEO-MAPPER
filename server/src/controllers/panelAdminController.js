import { getStatsModel , getUsersModel , getReservasHoyModel, getHistorialModel , getIngresosModel, getOcupacionCanchasModel, getReservasPendientesModel, eliminarUsuarioModel} from "../models/panelAdminModels.js";

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
export const getReservasHoy = async (req, res) => {
  try {
    const reservas = await getReservasHoyModel();
    res.json({
      success: true,
      reservas  // ← faltaba esto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error al obtener reservas" });
  }
};

export const getHistorial = async (req, res) =>{
  try {
    const historial = await getHistorialModel();
    res.json({
      success: true,
      historial,
      
    })
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error al obtener historial" });
  }
}

export const getIngresos = async (req, res) => {
  const { mes, anio } = req.query;
  try {
    const data = await getIngresosModel(mes, anio);
    res.json({
      success: true,
      totalMes: data.totalMes,
      totalReservas: data.totalReservas,
      promedioPorReserva: data.promedioPorReserva,
      porCancha: data.porCancha,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error al solicitar ingresos" });
  }
};


export const getReservasPendientes = async (req, res) => {
  try {
    const pendientes = await getReservasPendientesModel()
    res.json({ success: true, pendientes })
  } catch (error) {
    res.status(500).json({ success: false })
  }
}

export const getOcupacionCanchas = async (req, res) => {
  try {
    const canchas = await getOcupacionCanchasModel()
    res.json({ success: true, canchas })
  } catch (error) {
    res.status(500).json({ success: false })
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

