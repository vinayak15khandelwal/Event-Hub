import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events";
import EventForm from "../components/EventForm";
import { toast } from "../store/toastStore";

const CreateEvent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event created");
      navigate("/organizer");
    },
  });

  return (
    <div className="page-container py-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Create Event
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Set up your event details, seating capacity, and price tiers.
      </p>
      <EventForm onSubmit={mutation.mutateAsync} submitLabel="Create Event" />
    </div>
  );
};

export default CreateEvent;
