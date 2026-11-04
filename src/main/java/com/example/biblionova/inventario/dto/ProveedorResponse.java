package com.example.biblionova.inventario.dto;

public record ProveedorResponse(Integer proveedorId, String razonSocial, String documentoFiscal,
                                String contacto, String correo, String telefono, String direccion,
                                boolean activo) {}
