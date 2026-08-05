PYTHON ?= python3
HOOKS_DIR := .githooks

.PHONY: check check-phys check-quiz css render-check install-hooks

# 결정론적 검사를 먼저 — check_html_quality.py는 원격 이미지를 때려 429로 흔들린다
check:
	$(PYTHON) test_quiz_integrity.py
	$(PYTHON) test_css_classes.py
	$(PYTHON) check_html_quality.py

check-quiz:
	$(PYTHON) test_quiz_integrity.py

check-css:
	$(PYTHON) test_css_classes.py

# css/tailwind.build.css 재생성. cdn.tailwindcss.com을 대체하는 정적 빌드이므로,
# HTML이나 js/slide_engine.js에 새 Tailwind 클래스를 추가하면 반드시 다시 돌릴 것.
css:
	npx -y tailwindcss@3 -c tailwind.config.js -i tailwind.input.css -o css/tailwind.build.css --minify

check-phys:
	$(PYTHON) check_html_quality.py 7_physics_intro.html 8_uniform_motion.html 9_free_fall.html 10_work_energy.html 11_potential_energy.html 12_kinetic_energy.html 13_mechanical_energy.html 14_energy_conservation.html 15_unit_review.html lecture_notes.html index.html

render-check:
	@if [ -z "$(FILE)" ]; then echo "Usage: make render-check FILE=8_uniform_motion.html"; exit 2; fi
	$(PYTHON) render_check.py $(FILE)

install-hooks:
	sh scripts/install_git_hooks.sh
