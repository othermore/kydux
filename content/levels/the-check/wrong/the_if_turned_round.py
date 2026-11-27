wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for each_broom in brooms:
    steps = each_broom.distance_to(wizard)
    wizard.move_left(steps)
    if not each_broom.knotted:
        each_broom.untie()
