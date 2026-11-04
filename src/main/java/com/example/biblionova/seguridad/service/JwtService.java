package com.example.biblionova.seguridad.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expiracionMinutos;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiracion-minutos}") long expiracionMinutos) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expiracionMinutos = expiracionMinutos;
    }

    public String generar(UserDetails user) {
        Date ahora = new Date();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + expiracionMinutos * 60_000))
                .signWith(key)
                .compact();
    }

    public String extraerUsuario(String token) {
        return claims(token).getSubject();
    }

    public boolean esValido(String token, UserDetails user) {
        Claims c = claims(token);
        return c.getSubject().equals(user.getUsername()) && c.getExpiration().after(new Date());
    }

    public long getExpiracionMinutos() {
        return expiracionMinutos;
    }

    private Claims claims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
