.PHONY: build run test scan smoke
build:
	docker build -t day0-shield:1.0 .
run:
	docker run -d --name day0-shield -p 8080:8080 --env-file .env -v day0_data:/data \
	  --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true day0-shield:1.0
test:
	cd backend && python -m unittest discover -s tests -t .
scan:
	cd backend && pip-audit -r requirements.lock && cd ../frontend && npm audit --omit=dev
	trivy image day0-shield:1.0 && gitleaks detect
smoke:
	curl -fsS localhost:8080/healthz && curl -fsS localhost:8080/readyz
	curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/docs   # expect 404
	curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/auth/me   # expect 401
