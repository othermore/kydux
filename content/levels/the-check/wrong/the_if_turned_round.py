wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for broom in brooms:
    steps = broom.distance_to(wizard)
    wizard.move_left(steps)
    if not broom.knotted:
        broom.untie()
