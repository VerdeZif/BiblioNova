package com.example.biblionova.common.exception;

import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;

public record ApiError(int estado, String mensaje, LocalDateTime fecha) {
    public static ApiError de(HttpStatus s, String m) {
        return new ApiError(s.value(), m, LocalDateTime.now());
    }
}
