package com.clipboardshield.app;

import java.security.MessageDigest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ThreatDetector {

    public static class DetectionResult {
        public final boolean isThreat;
        public final String category;
        public final String ruleName;
        public final String maskedPreview;
        public final String sha256Hash;

        public DetectionResult(boolean isThreat, String category, String ruleName, String maskedPreview, String sha256Hash) {
            this.isThreat = isThreat;
            this.category = category;
            this.ruleName = ruleName;
            this.maskedPreview = maskedPreview;
            this.sha256Hash = sha256Hash;
        }

        public static DetectionResult safe() {
            return new DetectionResult(false, "CLEAN", "No Threats Detected", "", "");
        }
    }

    // Regex patterns for financial & confidential data
    private static final Pattern AWS_KEY_PATTERN = Pattern.compile("\\bAKIA[0-9A-Z]{16}\\b");
    private static final Pattern GITHUB_TOKEN_PATTERN = Pattern.compile("\\bgh[pousr]_[A-Za-z0-9_]{36,255}\\b");
    private static final Pattern PRIVATE_KEY_PATTERN = Pattern.compile("-----BEGIN [A-Z ]*PRIVATE KEY-----");
    private static final Pattern ETH_ADDRESS_PATTERN = Pattern.compile("\\b0x[a-fA-F0-9]{40}\\b");
    private static final Pattern BTC_ADDRESS_PATTERN = Pattern.compile("\\b(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\\b");
    private static final Pattern UPI_VPA_PATTERN = Pattern.compile("\\b[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}\\b");
    private static final Pattern OTP_PATTERN = Pattern.compile("\\b(?:otp|code|verification)\\s*(?:is|:)?\\s*([0-9]{4,8})\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern CREDIT_CARD_CANDIDATE = Pattern.compile("\\b(?:[0-9]{4}[ -]?){3}[0-9]{4}\\b|\\b[0-9]{13,19}\\b");

    public static DetectionResult scan(String text) {
        if (text == null || text.trim().isEmpty()) {
            return DetectionResult.safe();
        }

        String trimmed = text.trim();
        String hash = computeSha256(trimmed);

        // 1. Credit Card Check with Luhn Algorithm
        Matcher ccMatcher = CREDIT_CARD_CANDIDATE.matcher(trimmed);
        while (ccMatcher.find()) {
            String digits = ccMatcher.group().replaceAll("[\\s-]", "");
            if (digits.length() >= 13 && digits.length() <= 19 && isValidLuhn(digits)) {
                String masked = digits.substring(0, 4) + " •••• •••• " + digits.substring(digits.length() - 4);
                return new DetectionResult(true, "CREDIT_CARD", "Primary Account Number (Luhn-Verified)", masked, hash);
            }
        }

        // 2. Cloud Secret / AWS Access Key
        Matcher awsMatcher = AWS_KEY_PATTERN.matcher(trimmed);
        if (awsMatcher.find()) {
            String key = awsMatcher.group();
            String masked = key.substring(0, 4) + "••••••••" + key.substring(key.length() - 2);
            return new DetectionResult(true, "SECRET_TOKEN", "AWS Access Key ID", masked, hash);
        }

        // 3. GitHub Token
        Matcher ghMatcher = GITHUB_TOKEN_PATTERN.matcher(trimmed);
        if (ghMatcher.find()) {
            return new DetectionResult(true, "SECRET_TOKEN", "GitHub Personal Access Token", "ghp_••••••••••••", hash);
        }

        // 4. Private Key Block
        if (PRIVATE_KEY_PATTERN.matcher(trimmed).find()) {
            return new DetectionResult(true, "PRIVATE_KEY", "Cryptographic Private Key Block", "-----BEGIN PRIVATE KEY...-----", hash);
        }

        // 5. Crypto Wallet
        Matcher ethMatcher = ETH_ADDRESS_PATTERN.matcher(trimmed);
        if (ethMatcher.find()) {
            String eth = ethMatcher.group();
            String masked = eth.substring(0, 6) + "..." + eth.substring(eth.length() - 4);
            return new DetectionResult(true, "CRYPTO_WALLET", "Ethereum / EVM Address", masked, hash);
        }

        Matcher btcMatcher = BTC_ADDRESS_PATTERN.matcher(trimmed);
        if (btcMatcher.find()) {
            String btc = btcMatcher.group();
            String masked = btc.substring(0, 4) + "..." + btc.substring(btc.length() - 4);
            return new DetectionResult(true, "CRYPTO_WALLET", "Bitcoin Wallet Address", masked, hash);
        }

        // 6. Indian UPI VPA
        Matcher upiMatcher = UPI_VPA_PATTERN.matcher(trimmed);
        if (upiMatcher.find()) {
            String vpa = upiMatcher.group();
            if (!vpa.toLowerCase().endsWith("@gmail.com") && !vpa.toLowerCase().endsWith("@yahoo.com") && !vpa.toLowerCase().endsWith("@outlook.com")) {
                int atIdx = vpa.indexOf('@');
                String masked = (atIdx > 2 ? vpa.substring(0, 2) + "****" : "****") + vpa.substring(atIdx);
                return new DetectionResult(true, "UPI_FINANCIAL", "UPI Payment Address", masked, hash);
            }
        }

        // 7. OTP Code
        Matcher otpMatcher = OTP_PATTERN.matcher(trimmed);
        if (otpMatcher.find()) {
            return new DetectionResult(true, "OTP_CODE", "One-Time Password (OTP)", "OTP: ••••", hash);
        }

        return DetectionResult.safe();
    }

    private static boolean isValidLuhn(String number) {
        int sum = 0;
        boolean alternate = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(number.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }

    public static String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            return "0x0000000000000000";
        }
    }
}
