wizard.move_up(2)
brooms = wizard.find_all("broom")
for broom in brooms:
    if broom.knotted:
        broom.untie()
    wizard.move_right()
