package com.example.biblionova.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class})
    ResponseEntity<ApiError> credenciales(Exception e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.de(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> prohibido(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.de(HttpStatus.FORBIDDEN, "No tienes permisos para esta operación"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validacion(MethodArgumentNotValidException e) {
        String detalle = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(ApiError.de(HttpStatus.BAD_REQUEST, detalle));
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    ResponseEntity<ApiError> noEncontrado(RecursoNoEncontradoException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.de(HttpStatus.NOT_FOUND, e.getMessage()));
    }

    @ExceptionHandler(ConflictoException.class)
    ResponseEntity<ApiError> conflicto(ConflictoException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.de(HttpStatus.CONFLICT, e.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> integridad(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.de(HttpStatus.CONFLICT, "Operación no permitida: el registro está en uso o ya existe"));
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    ResponseEntity<ApiError> invalida(SolicitudInvalidaException e) {
        return ResponseEntity.badRequest()
                .body(ApiError.de(HttpStatus.BAD_REQUEST, e.getMessage()));
    }

    // <-- ESTE ES EL NUEVO INTERCEPTOR QUE AGREGAMOS
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> archivoGrande(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiError.de(HttpStatus.PAYLOAD_TOO_LARGE, "El archivo supera el tamaño máximo permitido (5 MB)"));
    }

    @ExceptionHandler(PessimisticLockingFailureException.class)
    ResponseEntity<ApiError> bloqueo(PessimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.de(HttpStatus.CONFLICT, "Otra operación estaba usando los mismos ejemplares; intenta de nuevo"));
    }
}
