eldras_key = wizard.find_nearest("key")
steps = eldras_key.distance_to(wizard)
wizard.move_left(steps)
wizard.pick_up()
door.open()
rest = 5 - steps
wizard.move_left(rest)
