PYTHON ?= python3
HOOKS_DIR := .githooks

.PHONY: check check-adv check-phys check-quiz css render-check interaction-check install-hooks

# 결정론적 검사를 먼저 — check_html_quality.py는 원격 이미지를 때려 429로 흔들린다
check:
	$(PYTHON) test_quiz_integrity.py
	$(PYTHON) test_css_classes.py
	$(PYTHON) test_lesson16.py
	$(PYTHON) check_html_quality.py

# 무기화학 과정만 — adv_inorganic/은 자기 폴더가 소유하되 검사는 여기서 돈다
check-adv:
	$(PYTHON) check_html_quality.py 'adv_inorganic/*.html'

check-quiz:
	$(PYTHON) test_quiz_integrity.py

check-css:
	$(PYTHON) test_css_classes.py
	$(PYTHON) test_lesson16.py

# css/tailwind.build.css 재생성. cdn.tailwindcss.com을 대체하는 정적 빌드이므로,
# HTML이나 js/slide_engine.js에 새 Tailwind 클래스를 추가하면 반드시 다시 돌릴 것.
css:
	npx -y tailwindcss@3 -c tailwind.config.js -i tailwind.input.css -o css/tailwind.build.css --minify

check-phys:
	$(PYTHON) check_html_quality.py 7_physics_intro.html 8_uniform_motion.html 9_free_fall.html 10_work_energy.html 11_potential_energy.html 12_kinetic_energy.html 13_mechanical_energy.html 14_energy_conservation.html review_motion_energy.html lecture_notes.html index.html

# 버튼이 실제로 반응하는지 — 정적 검사와 render-check가 못 잡는 영역이다
interaction-check:
	../unified_venv/bin/python interaction_check.py

render-check:
	@if [ -z "$(FILE)" ]; then echo "Usage: make render-check FILE=8_uniform_motion.html"; exit 2; fi
	$(PYTHON) render_check.py $(FILE)

install-hooks:
	sh scripts/install_git_hooks.sh
