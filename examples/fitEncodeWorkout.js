

class WorkoutEncoder extends FitEncoder {
	constructor(name, steps, addOpenTargets)
	{
		super();

		this.name = name;
		this.steps = steps;
		this.openSteps = addOpenTargets === true;
		this.totalSteps = steps.length + (this.openSteps == true ? 2 : 0);
		this.stepIndex = 0;

		console.log(`creating file for ${this.name} with ${this.steps.length} steps, add open targets is ${this.openSteps}`);

		new Message(FitConstants.mesg_num.file_id,
				FitMessages.file_id,
				"time_created",
				"manufacturer",
				"product",
				"type")
			.writeDataMessage(
				FitEncoder.toFitTimestamp(new Date()),
				FitConstants.manufacturer.the_sufferfest,
				0,
				FitConstants.file.workout,
			);
		new Message(FitConstants.mesg_num.workout,
				FitMessages.workout,
				"wkt_name",
				"sport",
				"num_valid_steps")
			.writeDataMessage(
				this.name,
				FitConstants.sport.cycling,
				this.totalSteps
			);
		
		let workoutStepMessage = new Message(FitConstants.mesg_num.workout_step,
			FitMessages.workout_step,
			"custom_target_value_low",
			"custom_target_value_high",
			"secondary_target_type",
			"secondary_custom_target_value_low",
			"secondary_custom_target_value_high",
			"target_type",
			"duration_type",
			"duration_value",
			"target_value",
			"intensity",
			"message_index");
		
		if (this.openSteps == true)
			workoutStepMessage.writeDataMessage(
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				FitConstants.wkt_step_target.open,
				FitConstants.wkt_step_duration.open,
				undefined,
				0,
				FitConstants.intensity.rest,
				this.stepIndex++
			);
		
		for (const step of this.steps)
				workoutStepMessage.writeDataMessage(
					step.watts === undefined ? undefined : step.watts[0],
					step.watts === undefined ? undefined : step.watts[1],
					FitConstants.wkt_step_target.cadence,
					step.rpm,
					step.rpm === undefined ? undefined : step.rpm + 5,
					FitConstants.wkt_step_target.power,
					FitConstants.wkt_step_duration.time,
					step.duration,
					0,
					step.intensity,
					this.stepIndex++
				);

		if (this.openSteps == true)
		workoutStepMessage.writeDataMessage(
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			FitConstants.wkt_step_target.open,
			FitConstants.wkt_step_duration.open,
			undefined,
			0,
			FitConstants.intensity.rest,
			this.stepIndex++
		);
	}
}
