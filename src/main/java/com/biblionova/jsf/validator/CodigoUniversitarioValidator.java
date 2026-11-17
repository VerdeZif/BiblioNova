
package com.biblionova.jsf.validator;

import jakarta.faces.application.FacesMessage;
import jakarta.faces.component.UIComponent;
import jakarta.faces.context.FacesContext;
import jakarta.faces.validator.FacesValidator;
import jakarta.faces.validator.Validator;
import jakarta.faces.validator.ValidatorException;

@FacesValidator("codigoUniversitarioValidator")
public class CodigoUniversitarioValidator implements Validator<String> {

    @Override
    public void validate(
            FacesContext context,
            UIComponent component,
            String value) {

        if (value == null || value.isBlank()) {
            return;
        }

        String codigo = value.trim();

        // Formato obligatorio: EST- seguido de 3 a 6 dígitos.
        if (!codigo.matches("EST-[0-9]{3,6}")) {

            FacesMessage mensaje = new FacesMessage(
                    FacesMessage.SEVERITY_ERROR,
                    "Código universitario inválido.",
                    "Utiliza el formato EST-001 o EST-000001."
            );

            throw new ValidatorException(mensaje);
        }
    }
}
