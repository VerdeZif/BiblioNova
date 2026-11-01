package com.example.biblionova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling; // <-- NUEVO IMPORT
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling // <-- NUEVA ANOTACIÓN
public class BiblionovaApplication {
    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
        SpringApplication.run(BiblionovaApplication.class, args);
    }
}
