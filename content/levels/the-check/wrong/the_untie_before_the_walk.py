wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for broom in brooms:
    if broom.knotted:
        broom.untie()
    steps = broom.distance_to(wizard)
    wizard.move_left(steps)
