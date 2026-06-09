PYTHON ?= python3
HOOKS_DIR := .githooks

.PHONY: check check-phys render-check install-hooks

check:
	$(PYTHON) check_html_quality.py

check-phys:
	$(PYTHON) check_html_quality.py 7_physics_intro.html 8_uniform_motion.html 9_free_fall.html 10_work_energy.html 11_potential_energy.html 12_kinetic_energy.html 13_mechanical_energy.html 14_energy_conservation.html 15_unit_review.html lecture_notes.html index.html

render-check:
	@if [ -z "$(FILE)" ]; then echo "Usage: make render-check FILE=8_uniform_motion.html"; exit 2; fi
	$(PYTHON) render_check.py $(FILE)

install-hooks:
	sh scripts/install_git_hooks.sh
