import crypto from "crypto";
import { Preference, Payment } from "mercadopago";
import mpClient from "../config/mercadopago.js";
import { pool } from "../db/connection.js";

import {
  getPlanesModel,
  getPlanByIdModel,
  getMembresiaActivaModel,
  getHistorialMembresiasModel,
  activarMembresiaModel,
  crearPagoPendienteModel,
  getPagoByMpPaymentIdModel,
  actualizarPagoModel,
  getHistorialPagosModel,
  editarPlanModel,
  eliminarMembresiaModel,
  crearPlanModel
} from "../models/membresiaModels.js";

// GET /membresia/planes
export const getPlanes = async (req, res) => {
  try {
    const planes = await getPlanesModel();

    res.json({
      success: true,
      planes,
    });
  } catch (error) {
    console.error("Error obteniendo planes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// GET /membresia/mi-membresia
export const getMiMembresia = async (req, res) => {
  try {
    const membresia = await getMembresiaActivaModel(req.user.id);

    res.json({
      success: true,
      activa: !!membresia,
      membresia,
    });
  } catch (error) {
    console.error("Error obteniendo membresía:", error);
    res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

// GET /membresia/historial
export const getHistorial = async (req, res) => {
  try {
    const [membresias, pagos] = await Promise.all([
      getHistorialMembresiasModel(req.user.id),
      getHistorialPagosModel(req.user.id),
    ]);

    res.json({
      success: true,
      membresias,
      pagos,
    });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({
      success: false,
      message: "Error interno",
    });
  }
};

export const editarPlan = async (req, res) => {
  
  try {
    const body = req.body;
    console.log(body)
    const resultado = await editarPlanModel(body); // no pisar "res"

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el plan a editar.",
      });
    }

    res.json({
      success: true,
      message: "Edicion exitosa.",
      plan: { ...body, id: Number(body.id) }, // el front necesita "data.plan"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const eliminarMembresia = async (req, res) => {
  const id = req.params.id;
  try {
    const resultado = await eliminarMembresiaModel(id); // no pisar "res"

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró el plan a eliminar.",
      });
    }

    res.json({
      success: true,
      message: "Eliminacion exitosa",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message, // "error" es un objeto Error, no se serializa bien en JSON — mandá error.message
    });
  }
};

export const crearPlan = async (req, res) => {
  try {
    const nuevoPlan = await crearPlanModel(req.body);

    res.json({
      success: true,
      message: "Creación exitosa",
      plan: nuevoPlan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al crear el plan",
    });
  }
};

// POST /membresia/crear-preferencia   body: { idMembresia }
export const crearPreferencia = async (req, res) => {
  console.log(req.body)
  try {
    const { idMembresia } = req.body;
    const usuario = req.user;

    if (!idMembresia) {
      return res.status(400).json({
        success: false,
        message: "Debe indicar el plan de membresía",
      });
    }

    const plan = await getPlanByIdModel(idMembresia);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "El plan seleccionado no existe",
      });
    }

    // 1) Registrar el pago como pendiente para tener un id propio
    //    que viaja como external_reference en Mercado Pago.
    const idPago = await crearPagoPendienteModel({
      idUsuario: usuario.id,
      idMembresia: plan.id,
      monto: plan.precio,
      mpPreferenceId: null,
    });

    // 2) Crear la preferencia de pago en Mercado Pago
    const preference = new Preference(mpClient);

    // Nota: no usamos "auto_return" porque Mercado Pago lo rechaza cuando
    // las back_urls no son un dominio público (ej: localhost en desarrollo),
    // tirando el error "auto_return invalid. back_url.success must be defined"
    // aunque esté definida. Sin auto_return, el usuario vuelve a tu sitio
    // clickeando el botón "Volver al sitio" en la pantalla de resultado de MP.
    const preferenceData = {
      items: [
        {
          id: String(plan.id),
          title: `Membresía ${plan.nombre} - DRONE VIDEO MAPPER'ia`,
          description: plan.descripcion,
          quantity: 1,
          unit_price: Number(plan.precio),
          currency_id: "ARS",
        },
      ],
      payer: {
        email: usuario.email,
      },
      external_reference: String(idPago),
      back_urls: {
        success: `${process.env.CLIENT_URL}/membresia/resultado?estado=success`,
        failure: `${process.env.CLIENT_URL}/membresia/resultado?estado=failure`,
        pending: `${process.env.CLIENT_URL}/membresia/resultado?estado=pending`,
      },
      notification_url: `${process.env.API_URL}/membresia/webhook`,
      statement_descriptor: "DRONEMAPPERIA",
    };

    const result = await preference.create({ body: preferenceData });

    // 3) Guardar el id de preferencia en el pago pendiente
    await pool.query(`UPDATE pago SET mp_preference_id = ? WHERE id = ?`, [
      result.id,
      idPago,
    ]);

    res.json({
      success: true,
      preferenceId: result.id,
      initPoint:
        process.env.NODE_ENV === "production"
          ? result.init_point
          : result.sandbox_init_point,
      publicKey: process.env.MP_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo iniciar el pago. Intente nuevamente.",
    });
  }
};

// Verifica la firma que Mercado Pago manda en el header x-signature
// para confirmar que la notificación realmente viene de MP.
// Doc: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
const validarFirmaWebhook = (req) => {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // Si no configuraste la clave secreta en el panel de MP, no se valida
  // (recomendado configurarla en producción).
  if (!secret) return true;

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];

  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(",");
  let ts;
  let hash;

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key && key.trim() === "ts") ts = value?.trim();
    if (key && key.trim() === "v1") hash = value?.trim();
  });

  const dataId =
    req.query["data.id"] || req.body?.data?.id || req.body?.data?.id;

  if (!ts || !hash || !dataId) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === hash;
};

// POST /membresia/webhook  (ruta pública, la llama Mercado Pago)
export const webhook = async (req, res) => {
  try {
    // Respondemos 200 rápido siempre que la firma sea válida,
    // MP reintenta si no recibe 200/201.
    if (!validarFirmaWebhook(req)) {
      console.warn("⚠️ Webhook MP con firma inválida");
      return res.sendStatus(401);
    }

    // MP manda notificaciones en 2 formatos posibles:
    //  - Webhooks (nuevo):  ?type=payment&data.id=123   (o en el body)
    //  - IPN (legacy):      ?topic=payment&id=123       (siempre por query)
    const type =
      req.query.type || req.body.type || req.query.topic || req.body.topic;
    const paymentId =
      req.query["data.id"] ||
      req.body?.data?.id ||
      req.query.id ||
      req.body?.resource;

    // Log temporal para depurar qué formato está mandando MP en tu cuenta.
    // Sacar una vez confirmado que anda.
    console.log("📩 Webhook MP recibido:", {
      query: req.query,
      body: req.body,
      typeDetectado: type,
      paymentIdDetectado: paymentId,
    });

    if (type !== "payment" || !paymentId) {
      // Notificaciones de otros tipos (merchant_order, etc). Las ignoramos.
      return res.sendStatus(200);
    }

    const paymentClient = new Payment(mpClient);
    const paymentInfo = await paymentClient.get({ id: paymentId });

    const idPago = paymentInfo.external_reference;
    const status = paymentInfo.status; // approved | rejected | pending | in_process...
    const statusDetail = paymentInfo.status_detail;

    if (!idPago) {
      console.warn("⚠️ Webhook MP sin external_reference");
      return res.sendStatus(200);
    }

    // Idempotencia: si ese payment id ya fue procesado, no repetir.
    const yaProcesado = await getPagoByMpPaymentIdModel(String(paymentId));
    if (yaProcesado && yaProcesado.estado === "aprobado") {
      return res.sendStatus(200);
    }

    let estadoPago = "pendiente";
    if (status === "approved") estadoPago = "aprobado";
    else if (status === "rejected" || status === "cancelled")
      estadoPago = "rechazado";

    await actualizarPagoModel({
      idPago,
      mpPaymentId: String(paymentId),
      mpStatus: status,
      mpStatusDetail: statusDetail,
      estado: estadoPago,
    });

    if (estadoPago === "aprobado") {
      const [rows] = await pool.query(
        `SELECT id_usuario, id_membresia FROM pago WHERE id = ?`,
        [idPago],
      );

      if (rows[0]) {
        await activarMembresiaModel(rows[0].id_usuario, rows[0].id_membresia);
        console.log(`✅ Membresía activada para usuario ${rows[0].id_usuario}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error procesando webhook de Mercado Pago:", error);
    // Igual devolvemos 200 para que MP no reintente infinitamente algo
    // que ya está logueado; si preferís que reintente, usar 500.
    res.sendStatus(200);
  }
};
