//package admin.controller;
//
//import java.util.*;
//import java.lang.reflect.*;
//
///**
// * Tiny JSON serializer with NO external libraries.
// * Supports primitives, Strings, Maps, Lists, and simple POJOs (public fields).
// */
//public class JsonUtil {
//
//    public static String toJson(Object obj) {
//        StringBuilder sb = new StringBuilder();
//        writeValue(sb, obj);
//        return sb.toString();
//    }
//
//    private static void writeValue(StringBuilder sb, Object obj) {
//        if (obj == null) {
//            sb.append("null");
//            return;
//        }
//        if (obj instanceof String) {
//            sb.append('"').append(escape((String) obj)).append('"');
//            return;
//        }
//        if (obj instanceof Number || obj instanceof Boolean) {
//            sb.append(obj.toString());
//            return;
//        }
//        if (obj instanceof Map) {
//            writeMap(sb, (Map<?, ?>) obj);
//            return;
//        }
//        if (obj instanceof Iterable) {
//            writeIterable(sb, (Iterable<?>) obj);
//            return;
//        }
//
//        // POJO (public fields)
//        writePojo(sb, obj);
//    }
//
//    private static void writeMap(StringBuilder sb, Map<?, ?> map) {
//        sb.append("{");
//        boolean first = true;
//        for (Map.Entry<?, ?> e : map.entrySet()) {
//            if (!(e.getKey() instanceof String)) continue;
//            if (!first) sb.append(",");
//            first = false;
//            sb.append('"').append(escape((String) e.getKey())).append('"').append(":");
//            writeValue(sb, e.getValue());
//        }
//        sb.append("}");
//    }
//
//    private static void writeIterable(StringBuilder sb, Iterable<?> it) {
//        sb.append("[");
//        boolean first = true;
//        for (Object v : it) {
//            if (!first) sb.append(",");
//            first = false;
//            writeValue(sb, v);
//        }
//        sb.append("]");
//    }
//
//    private static void writePojo(StringBuilder sb, Object obj) {
//        sb.append("{");
//        boolean first = true;
//        for (Field f : obj.getClass().getFields()) {
//            try {
//                Object v = f.get(obj);
//                if (!first) sb.append(",");
//                first = false;
//                sb.append('"').append(escape(f.getName())).append('"').append(":");
//                writeValue(sb, v);
//            } catch (Exception ignored) {}
//        }
//        sb.append("}");
//    }
//
//    private static String escape(String s) {
//        return s.replace("\\", "\\\\")
//                .replace("\"", "\\\"")
//                .replace("\n", "\\n")
//                .replace("\r", "\\r")
//                .replace("\t", "\\t");
//    }
//}
