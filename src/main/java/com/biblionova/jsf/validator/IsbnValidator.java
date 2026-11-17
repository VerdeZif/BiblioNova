
package com.biblionova.jsf.validator;

import jakarta.faces.application.FacesMessage;
import jakarta.faces.component.UIComponent;
import jakarta.faces.context.FacesContext;
import jakarta.faces.validator.FacesValidator;
import jakarta.faces.validator.Validator;
import jakarta.faces.validator.ValidatorException;

@FacesValidator("isbnValidator")
public class IsbnValidator implements Validator<String> {

    @Override
    public void validate(
            FacesContext context,
            UIComponent component,
            String value) {

        if (value == null || value.isBlank()) {
            return;
        }

        String isbn = value.replace("-", "").replace(" ", "");

        boolean valido;

        if (isbn.length() == 10) {
            valido = validarIsbn10(isbn);
        } else if (isbn.length() == 13) {
            valido = validarIsbn13(isbn);
        } else {
            valido = false;
        }

        if (!valido) {
            throw new ValidatorException(
                    new FacesMessage(
                            FacesMessage.SEVERITY_ERROR,
                            "ISBN inválido.",
                            "Ingresa un ISBN-10 o ISBN-13 válido."
                    )
            );
        }
    }

    private boolean validarIsbn10(String isbn) {
        if (!isbn.matches("[0-9]{9}[0-9Xx]")) {
            return false;
        }

        int suma = 0;

        for (int i = 0; i < 10; i++) {
            char caracter = isbn.charAt(i);

            int digito = (caracter == 'X' || caracter == 'x')
                    ? 10
                    : Character.digit(caracter, 10);

            suma += digito * (10 - i);
        }

        return suma % 11 == 0;
    }

    private boolean validarIsbn13(String isbn) {
        if (!isbn.matches("[0-9]{13}")) {
            return false;
        }

        int suma = 0;

        for (int i = 0; i < 13; i++) {
            int digito = Character.digit(isbn.charAt(i), 10);

            suma += digito * (i % 2 == 0 ? 1 : 3);
        }

        return suma % 10 == 0;
    }
}
