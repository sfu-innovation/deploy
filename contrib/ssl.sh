
OUT="/etc/ssl/private"
DOMAIN="innovate.cs.surrey.sfu.ca"
SUBJECT="/C=CA/ST=British Columbia/L=Vancouver/O=Simon Fraser University/CN=*.${DOMAIN}"
SIGNER="/C=CA/ST=British Columbia/L=Vancouver/O=Simon Fraser University/CN=Root Authority"
DAYS=365

# Create the EC parameters
openssl ecparam -name prime256v1 -out curve.pem

# Create the CA
openssl req -new -x509 \
	-days 3650 \
	-extensions v3_ca \
	-keyout ${OUT}/innovate.sfu.ca.key \
	-out ${OUT}/innovate.ca.crt

# Create the CSR
openssl req -new -newkey ec:curve.pem \
	-nodes \
	-out ${DOMAIN}.csr \
	-keyout ${OUT}/${DOMAIN}.key \
	-subj "${SUBJECT}"

# Sign the CSR
openssl x509 -req -days $DAYS \
	-in ${DOMAIN}.csr \
	-signkey ${OUT}/innovate.sfu.ca.key \
	-out ${OUT}/${DOMAIN}.crt

# Clean up the CSR
rm ${DOMAIN}.csr
