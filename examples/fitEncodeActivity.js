
class ActivityEncoder extends FitEncoder {
	constructor(activity) {
		super();

		this.activity = activity;

		const numRecords = activity.durationSeconds;

		let fileIdMessage = new Message(FitConstants.mesg_num.file_id,
			FitMessages.file_id,
			"time_created",
			"manufacturer",
			"product",
			"type");
		let eventMessage = new Message(FitConstants.mesg_num.event,
			FitMessages.event,
			"timestamp",
			"data",
			"event",
			"event_type");
		let deviceInfoMessage = new Message(FitConstants.mesg_num.device_info,
			FitMessages.device_info,
			"timestamp",
			"product_name",
			"manufacturer",
			"product",
			"device_index");
			console.log('sport');
		let sportMessage = new Message(FitConstants.mesg_num.sport,
			FitMessages.sport,
			"sport",
			"sub_sport");
		let workoutMessage = new Message(FitConstants.mesg_num.workout,
			FitMessages.workout,
			"wkt_name",
			"sport",
			"sub_sport");
		let recordMessage = new Message(FitConstants.mesg_num.record,
			FitMessages.record,
			"timestamp",
			"power",
			"heart_rate",
			"cadence");
		let sessionMessage = new Message(FitConstants.mesg_num.session,
			FitMessages.session,
			"timestamp",
			"start_time",
			"total_elapsed_time",
			"total_timer_time",
			"total_distance",
			"total_work",
			"total_moving_time",
			//"avg_speed",
			//"max_speed",
			"avg_power",
			//"max_power",
			"normalized_power",
			"training_stress_score",
			"intensity_factor",
			//"threshold_power",
			"event",
			"event_type",
			"sport",
			"sub_sport",
			"avg_heart_rate",
			"max_heart_rate",
			"avg_cadence",
			"max_cadence",
			//"min_heart_rate"
			);
		let activityMessage = new Message(FitConstants.mesg_num.activity,
			FitMessages.activity,
			"total_timer_time",
			"local_timestamp",
			"num_sessions",
			"type",
			"event",
			"event_type");
		
		const startTime = FitEncoder.toFitTimestamp(new Date(activity.startTime));
		const endTime = FitEncoder.toFitTimestamp(new Date(activity.completedDate));

		console.log('dates:', startTime, endTime);

		fileIdMessage.writeDataMessage(
			startTime, // time_created
			FitConstants.manufacturer.the_sufferfest,
			0,
			FitConstants.file.activity
		);

		eventMessage.writeDataMessage(
			startTime,
			0,
			FitConstants.event.timer,
			FitConstants.event_type.start
		);

		deviceInfoMessage.writeDataMessage(
			startTime,
			"SYSTM",
			FitConstants.manufacturer.the_sufferfest,
			0,
			FitConstants.device_index.creator
		);

		sportMessage.writeDataMessage(
			FitConstants.sport.cycling,
			FitConstants.sub_sport.indoor_cycling
		);

		workoutMessage.writeDataMessage(
			activity.name,
			FitConstants.sport.cycling,
			FitConstants.sub_sport.indoor_cycling
		);

		// each sample is 1 second
		console.log(`number of records: ${numRecords}`);
		for (let ix = 0; ix < numRecords; ++ix)
		{
			recordMessage.writeDataMessage(
				startTime + ix,
				activity.power[ix],
				activity.heartRate[ix],
				activity.cadence[ix]
			);
		}

		eventMessage.writeDataMessage(
			endTime,
			0,
			FitConstants.event.timer,
			FitConstants.event_type.stop_all
		);

		eventMessage.writeDataMessage(
			endTime,
			0,
			FitConstants.event.session,
			FitConstants.event_type.stop_disable_all
		);

		sessionMessage.writeDataMessage(
			endTime,
			startTime,
			(endTime - startTime) * 1000, // scale = 1000
			(endTime - startTime) * 1000, // scale = 1000
			(activity.distanceKm) * 1000 * 100, // scale = 100
			activity.kJ * 1000,
			(endTime - startTime) * 1000, // scale = 1000
			//(activity.averageSpeed * 1000) / 2.236936, // scale = 1000
			//(activity.maxSpeed * 1000) / 2.236936, // scale = 1000
			activity.averagePower,
			//0,
			activity.normalizedPower,
			activity.tss * 10, // scale = 10
			activity.intensityFactor * 1000, // scale = 1000
			//0,
			FitConstants.event.session,
			FitConstants.event_type.stop,
			FitConstants.sport.cycling,
			FitConstants.sub_sport.indoor_cycling,
			activity.averageHeartRate,
			activity.maxHeartRate,
			activity.averageCadence,
			activity.maxCadence,
			//0
		);

		activityMessage.writeDataMessage(
			endTime - startTime,
			startTime,
			1,
			FitConstants.activity.manual,
			FitConstants.event.activity,
			FitConstants.event_type.stop
		);
	}
}
