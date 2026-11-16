brooms = wizard.find_all("broom")
wizard.move_up(3)
wizard.move_right(4)
for broom in brooms:
    steps = broom.distance_to(wizard)
    wizard.move_left(steps)
    broom.untie()
