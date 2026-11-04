package com.example.biblionova.inventario.dto;

import com.example.biblionova.inventario.entity.CondicionFisica;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarEjemplarRequest(Integer ubicacionId, Boolean esVendible, Boolean esPrestamo,
                                        CondicionFisica condicionFisica,
                                        @Size(max = 500) String observaciones,
                                        @NotBlank @Size(max = 500) String motivo) {}
