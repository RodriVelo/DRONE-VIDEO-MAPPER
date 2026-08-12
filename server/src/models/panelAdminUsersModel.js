import { pool } from "../db/connection.js"

export const cambiarEstadoUsuarioModel = async (id,nuevoEstado) =>{
    try {
        await pool.query(`
            UPDATE usuario
            SET estado = ?
            WHERE id = ?`,[nuevoEstado,id])
    } catch (error) {
        throw(error)
    }
}

export const editarPerfilUsuarioModel = async (id,nuevoPerfil) =>{
    try {
        await pool.query(
            `UPDATE usuario
            SET nombre=?,apellido=?,email=?, telefono=?, id_rol=?, nro_documento=?
            WHERE id=?`,
            [nuevoPerfil.nombre, nuevoPerfil.apellido, nuevoPerfil.email, nuevoPerfil.telefono, nuevoPerfil.rol, nuevoPerfil.nro_documento, id]
        )
    } catch (error) {
        throw(error)
    }
}