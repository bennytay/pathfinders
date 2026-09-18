.PHONY: web-sync web-check

web-sync:
	python3 scripts/sync_ios_demo.py

web-check:
	python3 scripts/sync_ios_demo.py --check
	node --check web/app.js
