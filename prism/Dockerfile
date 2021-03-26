FROM stoplight/prism

COPY spec/oas.yaml /oas.yaml
CMD ["mock", "/oas.yaml", "-h", "0.0.0.0", "-p", "80"]
