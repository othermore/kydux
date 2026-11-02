key = wizard.find_nearest("key")
steps = key.distance_to(wizard)
wizard.move_left(steps)
wizard.pick_up()
rest = 5 - steps
wizard.move_left(rest)
door.open()
