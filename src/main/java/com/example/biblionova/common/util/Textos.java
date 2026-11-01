package com.example.biblionova.common.util;

public final class Textos {
    private Textos() {}

    public static String anexar(String actual, String extra, int max) {
        String s = (actual == null || actual.isBlank()) ? extra : actual + " | " + extra;
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}