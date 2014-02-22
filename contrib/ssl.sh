
OUT="/etc/ssl/private"
DOMAIN="innovate.cs.surrey.sfu.ca"
SUBJECT="/C=CA/ST=British Columbia/L=Vancouver/O=Simon Fraser University/CN=*.${DOMAIN}"
DAYS=365

# Create the EC parameters
openssl ecparam -name secp160r2 -out curve.pem

# Create the CSR
openssl req -new -newkey ec:curve.pem \
	-nodes \
	-out ${DOMAIN}.csr \
	-keyout ${OUT}/${DOMAIN}.key \
	-subj "${SUBJECT}"

# Sign the CSR
openssl x509 -req -days $DAYS \
	-in ${DOMAIN}.csr \
	-extensions v3_ca \
	-signkey ${OUT}/${DOMAIN}.key \
	-out ${OUT}/${DOMAIN}.crt

# Clean up the CSR
rm ${DOMAIN}.csr
